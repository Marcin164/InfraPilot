import React from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import CardHeader from '../../../../Components/Headers/CardHeader'
import { faPen, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { getAssignmentGroups } from '../../../../Services/assignmentGroups'
import ButtonPrimary from '../../../../Components/Buttons/ButtonPrimary'
import { usePermissions } from '../../../../Hooks/usePermissions'
import { hasPermission } from '../../../../Constants/navigation'

type Props = {}

const AssignmentsGroups = (props: Props) => {
    const { t } = useTranslation();
    const params: any = useParams();
    const navigate  = useNavigate()
    const permissionsQuery = usePermissions();
    // Matches the target page's own gate (Settings > Admin) -- this button
    // is only useful if clicking it actually gets you somewhere.
    const canManage = hasPermission("admin.roleAssignment.manage", permissionsQuery.data);

    const userAssignmentGroupsQuery = useQuery({
        queryKey: ["userAssignmentGroups", params.id],
        queryFn: async () => {
            const groups = await getAssignmentGroups();
            return groups.filter((group) =>
                group.members?.some((member) => member.id === params.id),
            );
        },
        enabled: Boolean(params.id),
    });

    const groups = userAssignmentGroupsQuery.data ?? [];

    return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("users.assignment.groups")} icon={faUsers} />
        <div className="mt-3 flex flex-wrap gap-2">
            {groups.length > 0 ? (
                groups.map((group) => (
                    <span
                        key={group.id}
                        className="rounded-full bg-[#EEF5FD] text-[#2B9AE9] text-[12px] font-semibold px-3 py-1"
                    >
                        {group.name}
                    </span>
                ))
            ) : (
                <div className="text-[13px] text-[#9a9a9a]">
                    {t("users.assignment.groups.empty")}
                </div>
            )}
        </div>
        {canManage && (
        <div className="py-2">
        <ButtonPrimary icon={faPen} text={t('btn.edit.asssignments')} onClick={() => navigate('/admin/settings/admin')}/>
        </div>
        )}
    </div>
  )
}

export default AssignmentsGroups;